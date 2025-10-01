import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import Navbar from '../components/navbar';
import WeekCalendar from '../components/WeekCalendar';
import { getCurrentWeekDates } from '../utils/dateUtils';

export default function CommentScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const navOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);
  const navbarRef = useRef(null);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const weekDates = getCurrentWeekDates();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const handleDateSelect = (selectedDate) => {
    console.log('Selected date:', selectedDate.full);
  };

  useEffect(() => {
    if (!user?.email) return;

    const commentsRef = collection(db, 'comments');
    // Just query by user email first
    const q = query(commentsRef, where('userEmail', '==', user.email.toLowerCase()));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }));

      // Sort in descending order (newest first)
      const sortedComments = commentsData.sort((a, b) => {
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      setComments(sortedComments);
    });

    return () => unsubscribe();
  }, [user?.email]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !user?.email) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'comments'), {
        userEmail: user.email.toLowerCase(),
        message: newComment.trim(),
        timestamp: serverTimestamp(),
        isRead: false,
        sender: 'client',
        urgent: true,
      });

      setNewComment('');
      Alert.alert('Success', 'Your urgent message has been sent to Cymron!');
    } catch (error) {
      console.error('Error sending comment:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: false,
    listener: (event) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      if (navbarRef.current) {
        navbarRef.current.show();
      }

      scrollTimeout.current = setTimeout(() => {
        if (navbarRef.current) {
          navbarRef.current.hide();
        }
      }, 2000);

      lastScrollY.current = currentScrollY;
    },
  });

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.headerTitle}>Need urgent help?</Text>
          <Text style={styles.headerTitle}>Chat with Cymron!</Text>
          <Text style={styles.dateText}>{`${currentMonth}, ${currentYear}`}</Text>
        </View>
      </View>

      <WeekCalendar
        weekDates={weekDates}
        onDatePress={handleDateSelect}
        containerStyle={styles.calendarContainerStyle}
      />
    </View>
  );

  const renderUrgentNotice = () => (
    <View style={styles.urgentCard}>
      <View style={styles.urgentHeader}>
        <View style={styles.urgentIconContainer}>
          <Ionicons name="warning-outline" size={22} color="#fff" />
        </View>
        <Text style={styles.urgentTitle}>Urgent Support</Text>
      </View>
      <Text style={styles.urgentSubtitle}>
        This is for urgent matters only. Cymron will respond as soon as possible.
      </Text>
    </View>
  );

  const renderComments = () => (
    <View style={styles.commentsSection}>
      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>Chat History</Text>
      </View>

      <View style={styles.commentsContainer}>
        {comments.length === 0 ? (
          <View style={styles.noCommentsContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
            <Text style={styles.noCommentsText}>No messages yet</Text>
            <Text style={styles.noCommentsSubtext}>Send your first urgent message to Cymron</Text>
          </View>
        ) : (
          <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
            {comments.map((comment, index) => (
              <View
                key={comment.id}
                style={[
                  styles.commentBubble,
                  comment.sender === 'client' ? styles.clientBubble : styles.cymronBubble,
                ]}>
                <Text
                  style={[
                    styles.commentText,
                    comment.sender === 'client' ? styles.clientText : styles.cymronText,
                  ]}>
                  {comment.message}
                </Text>
                <Text
                  style={[
                    styles.commentTime,
                    comment.sender === 'client' ? styles.clientTime : styles.cymronTime,
                  ]}>
                  {comment.timestamp.toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );

  const renderMessageInput = () => (
    <View style={styles.inputSection}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Type your urgent message..."
          placeholderTextColor="#666"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newComment.trim() || loading) && styles.sendButtonDisabled]}
          onPress={handleSendComment}
          disabled={!newComment.trim() || loading}>
          {loading ? (
            <Ionicons name="hourglass-outline" size={20} color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}>
          {renderHeader()}

          <View style={styles.content}>
            {renderUrgentNotice()}
            {renderComments()}
          </View>
        </ScrollView>

        {renderMessageInput()}
        <Navbar ref={navbarRef} activeScreen="Comments" opacityValue={navOpacity} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 160,
  },
  headerContainer: {
    backgroundColor: '#081A2F',
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    top: 25,
  },
  headerTitle: {
    color: '#fff',
    fontSize: Dimensions.get('window').width * 0.09,
    fontWeight: 'bold',
    lineHeight: Dimensions.get('window').width * 0.095,
  },
  dateText: {
    color: '#fff',
    fontSize: Dimensions.get('window').width * 0.035,
    opacity: 0.7,
    marginTop: 10,
  },
  calendarContainerStyle: {
    width: '100%',
    paddingTop: 10,
    paddingHorizontal: Dimensions.get('window').width * 0.02,
  },
  content: {
    backgroundColor: '#f5f5f5',
    padding: Dimensions.get('window').width * 0.05,
    flex: 1,
    marginTop: 0,
  },
  urgentCard: {
    backgroundColor: '#C7312B',
    borderRadius: 16,
    padding: Dimensions.get('window').width * 0.04,
    marginBottom: Dimensions.get('window').height * 0.025,
  },
  urgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  urgentIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  urgentTitle: {
    color: '#fff',
    fontSize: Dimensions.get('window').width * 0.045,
    fontWeight: 'bold',
  },
  urgentSubtitle: {
    color: '#fff',
    fontSize: Dimensions.get('window').width * 0.032,
    opacity: 0.9,
    lineHeight: 20,
  },
  commentsSection: {
    flex: 1,
  },
  commentsHeader: {
    marginBottom: 15,
  },
  commentsTitle: {
    color: '#081A2F',
    fontSize: Dimensions.get('window').width * 0.055,
    fontWeight: 'bold',
  },
  commentsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    minHeight: 300,
    maxHeight: 400,
  },
  noCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  commentsList: {
    flex: 1,
  },
  commentBubble: {
    marginBottom: 15,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
  },
  clientBubble: {
    backgroundColor: '#C7312B',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  cymronBubble: {
    backgroundColor: '#081A2F',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 20,
  },
  clientText: {
    color: '#fff',
  },
  cymronText: {
    color: '#fff',
  },
  commentTime: {
    fontSize: 11,
    marginTop: 5,
  },
  clientTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  cymronTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputSection: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    maxHeight: 80,
    fontSize: 16,
    color: '#333',
    paddingVertical: 5,
  },
  sendButton: {
    backgroundColor: '#C7312B',
    borderRadius: 20,
    padding: 10,
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});