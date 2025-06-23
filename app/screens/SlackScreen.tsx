import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthRequest, makeRedirectUri, ResponseType } from 'expo-auth-session';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

// 🔐 Slack credentials from environment
const slackTeamId = process.env.SLACK_TEAM_ID!;
const slackClientId = process.env.SLACK_CLIENT_ID!;
const slackClientSecret = process.env.SLACK_CLIENT_SECRET!;
const coachEmail = process.env.COACH_EMAIL!;
const publicChannelId = process.env.PUBLIC_CHANNEL_ID!;

// 🔗 Use Expo's auth proxy for redirect URI
const redirectUri = 'https://auth.expo.io/@parthratra11/NutritionApp';
// const redirectUri = makeRedirectUri({ useProxy: true });
console.log('Using redirectUri:', redirectUri);

// 🔗 Slack Auth Discovery
const discovery = {
  authorizationEndpoint: 'https://slack.com/oauth/v2/authorize',
  tokenEndpoint: 'https://slack.com/api/oauth.v2.access',
};

// Optional domain for display
const slackWorkspaceDomain = 'nutritionappglobal.slack.com';

export default function SlackScreen() {
  const [slackToken, setSlackToken] = useState<string | null>(null);
  const [dmChannel, setDmChannel] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔑 Set up Slack OAuth request
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: slackClientId,
      scopes: [
        'chat:write',
        'channels:read',
        'channels:history',
        'groups:read',
        'groups:history',
        'im:read',
        'im:history',
        'im:write',
        'users:read',
        'users:read.email',
        'team:read',
        'users.profile:read',
      ],
      redirectUri,
      responseType: ResponseType.Code,
      extraParams: { team: slackTeamId },
    },
    discovery
  );

  // 🔁 Restore stored token
  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('slackToken');
      if (token) {
        setSlackToken(token);
        initSlack(token);
      }
    })();
  }, []);

  // 🎯 Slack OAuth response handler
  useEffect(() => {
    console.log('OAuth Response:', response);
    if (response?.type === 'success' && response.params.code) {
      exchangeSlackToken(response.params.code);
    }
  }, [response]);

  const handleSlackLogin = async () => {
    console.log('Prompting Slack login with redirectUri:', redirectUri);
    await promptAsync({ useProxy: true }); // <-- must be true for Expo proxy URI
  };

  const exchangeSlackToken = async (code: string) => {
    console.log('Exchanging token with redirectUri:', redirectUri);
    try {
      const res = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `client_id=${slackClientId}&client_secret=${slackClientSecret}&code=${code}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}`,
      });

      const tokenData = await res.json();
      console.log('Token Exchange Data:', tokenData);

      if (!tokenData.ok) {
        Alert.alert('Slack Auth Error', tokenData.error || 'Token exchange failed');
        return;
      }

      const token = tokenData.access_token;
      setSlackToken(token);
      await SecureStore.setItemAsync('slackToken', token);

      if (auth.currentUser) {
        await setDoc(
          doc(db, 'users', auth.currentUser.uid),
          {
            slackToken: token,
            slackUserId: tokenData.authed_user?.id,
            slackTeam: tokenData.team?.id,
          },
          { merge: true }
        );
      }

      initSlack(token);
    } catch (e: any) {
      Alert.alert('Slack Login Error', e.message || 'OAuth flow failed');
    }
  };

  const initSlack = async (token: string) => {
    setLoading(true);
    try {
      // 1. Get coach ID by email
      const coachRes = await fetch(
        `https://slack.com/api/users.lookupByEmail?email=${coachEmail}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const coachData = await coachRes.json();
      const coachId = coachData.user?.id;
      if (!coachId) throw new Error('Coach not found');

      // 2. Open a DM with the coach
      const dmRes = await fetch('https://slack.com/api/conversations.open', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users: coachId }),
      });
      const dmData = await dmRes.json();
      if (!dmData.ok) throw new Error('Could not open DM');
      const dmId = dmData.channel.id;
      setDmChannel(dmId);

      // 3. Fetch DM + public channel messages
      const [dmMsgs, publicMsgs] = await Promise.all([
        fetchHistory(dmId, token),
        fetchHistory(publicChannelId, token),
      ]);
      setMessages([...dmMsgs, ...publicMsgs]);
    } catch (e: any) {
      Alert.alert('Slack Init Error', e.message || 'Slack setup failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (channel: string, token: string) => {
    const res = await fetch(`https://slack.com/api/conversations.history?channel=${channel}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.ok ? data.messages : [];
  };

  const send = async () => {
    if (!input.trim() || !slackToken) return;

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${slackToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: dmChannel || publicChannelId,
        text: input,
      }),
    });

    setInput('');
    initSlack(slackToken); // refresh messages
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {!slackToken ? (
        <>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>
            Workspace: {slackWorkspaceDomain}
          </Text>
          <Button title="Login with Slack" onPress={handleSlackLogin} disabled={!request} />
        </>
      ) : (
        <>
          {loading && <ActivityIndicator />}
          <FlatList
            data={messages}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={{ padding: 8, borderBottomWidth: 1, borderColor: '#ddd' }}>
                <Text style={{ fontWeight: 'bold' }}>{item.username || item.user}</Text>
                <Text>{item.text}</Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 12 }}
          />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 8,
              marginTop: 12,
              borderRadius: 6,
            }}
          />
          <Button title="Send" onPress={send} />
        </>
      )}
    </View>
  );
}
