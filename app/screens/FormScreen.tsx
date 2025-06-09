import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Button,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
// Import the Firestore instance from your firebase config file
import { db } from '../firebaseConfig.js';

export default function IntakeForm() {
  const [form, setForm] = useState({
    // Personal Info
    fullName: '',
    street: '',
    postalCode: '',
    city: '',
    country: '',
    age: '',
    height: '',
    weight: '',
    bodyFat: '',
    strengthTrainingExperience: '',
    // Strength
    benchPress: '',
    squat: '',
    chinUp: '',
    deadlift: '',
    overheadPress: '',
    strengthLevel: '',
    exerciseCompetency: '',
    // Goals
    goals: '',
    obstacle: '',
    otherExercises: '',
    dedicationLevel: '',
    weeklyFrequency: '',
    // Misc
    occupation: '',
    medicalConditions: '',
    specialDiet: '',
    // Lifestyle
    trainingTimePreference: '',
    activityLevel: '',
    stressLevel: '',
    sleepQuality: '',
    caffeineIntake: '',
    menstrualCycle: '',
    // Equipment
    calipers: '',
    myoTape: '',
    fitnessTech: '',
    cardioEquipment: '',
    squatRack: '',
    hyperBench: '',
    gluteHam: '',
    standingCalf: '',
    dipBelt: '',
    legCurl: '',
    gymRings: '',
    trx: '',
    resistanceBands: '',
    pullUpBar: '',
    seatedCalf: '',
    cableTower: '',
    otherEquipment: '',
    // Supplements
    supplements: '',
    // Genetics
    wristCircumference: '',
    ankleCircumference: '',
    // Current Program
    typicalDiet: '',
    currentTraining: '',
  });

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleCheckbox = (field) => {
    setForm({ ...form, [field]: !form[field] });
  };

  // Modified handleSubmit to use Firestore
  const handleSubmit = async () => {
    try {
      const docRef = await addDoc(collection(db, 'intakeForms'), form);
      console.log('Document written with ID: ', docRef.id);
      alert('Form submitted successfully!');
    } catch (error) {
      console.error('Error adding document: ', error);
      alert('Error submitting form.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Online Coaching Client Intake Form</Text>

        {/* GENERAL */}
        <Text style={styles.sectionTitle}>1. General</Text>
        <Text style={styles.label}>Full name*</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('fullName', t)}
          value={form.fullName}
        />

        <Text style={styles.label}>Street and house number</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('street', t)}
          value={form.street}
        />

        <Text style={styles.label}>Postal code</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('postalCode', t)}
          value={form.postalCode}
        />

        <Text style={styles.label}>City*</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('city', t)}
          value={form.city}
        />

        <Text style={styles.label}>Country*</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('country', t)}
          value={form.country}
        />

        <Text style={styles.label}>Age*</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('age', t)}
          value={form.age}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Height*</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('height', t)}
          value={form.height}
        />

        <Text style={styles.label}>Weight*</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('weight', t)}
          value={form.weight}
        />

        <Text style={styles.label}>Body fat percentage (plus estimation method)</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('bodyFat', t)}
          value={form.bodyFat}
        />

        <Text style={styles.label}>Do you have experience with strength training?</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('strengthTrainingExperience', t)}
          value={form.strengthTrainingExperience}
        />

        {/* STRENGTH LEVEL */}
        <Text style={styles.sectionTitle}>2. Strength Level</Text>
        <Text style={styles.label}>Barbell Bench Press (kg x reps)</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('benchPress', t)}
          value={form.benchPress}
        />

        <Text style={styles.label}>Back Squat (kg x reps)</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('squat', t)}
          value={form.squat}
        />

        <Text style={styles.label}>Chin-up (kg x reps)</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('chinUp', t)}
          value={form.chinUp}
        />

        <Text style={styles.label}>Deadlift (kg x reps)</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('deadlift', t)}
          value={form.deadlift}
        />

        <Text style={styles.label}>Barbell Overhead Press (kg x reps)</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('overheadPress', t)}
          value={form.overheadPress}
        />

        <Text style={styles.label}>
          How would you rate your competency on the aforementioned exercises?*
        </Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('exerciseCompetency', t)}
          value={form.exerciseCompetency}
        />

        {/* GOALS */}
        <Text style={styles.sectionTitle}>3. Goals</Text>
        <Text style={styles.label}>What are your top 3 goals?*</Text>
        <TextInput
          multiline
          style={styles.input}
          onChangeText={(t) => handleChange('goals', t)}
          value={form.goals}
        />

        <Text style={styles.label}>What is your number 1 obstacle?*</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('obstacle', t)}
          value={form.obstacle}
        />

        <Text style={styles.label}>
          Will you be performing any other form of exercise alongside strength training?*
        </Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('otherExercises', t)}
          value={form.otherExercises}
        />

        <Text style={styles.label}>What’s your dedication level?*</Text>
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity
            style={[styles.checkboxContainer, { alignItems: 'flex-start', marginBottom: 10 }]}
            onPress={() => handleChange('dedicationLevel', 'A')}>
            <View
              style={[styles.checkbox, form.dedicationLevel === 'A' && styles.checkboxChecked]}
            />
            <Text style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>A: </Text>
              Steady and sustainability is most important to me. As long as I’m moving in the right
              direction, I don’t mind about the rate of progress.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { alignItems: 'flex-start', marginBottom: 10 }]}
            onPress={() => handleChange('dedicationLevel', 'B')}>
            <View
              style={[styles.checkbox, form.dedicationLevel === 'B' && styles.checkboxChecked]}
            />
            <Text style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>B: </Text>I want to achieve results at a good pace
              whilst maintaining a balanced lifestyle.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { alignItems: 'flex-start' }]}
            onPress={() => handleChange('dedicationLevel', 'C')}>
            <View
              style={[styles.checkbox, form.dedicationLevel === 'C' && styles.checkboxChecked]}
            />
            <Text style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>C: </Text>I will do whatever it takes to achieve
              maximum results without compromising my health.
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>
          How often in a week would you be prepared to train for maximal results?*
        </Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('weeklyFrequency', t)}
          value={form.weeklyFrequency}
        />

        {/* Misc */}
        <Text style={styles.label}>What is your occupation?</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('occupation', t)}
          value={form.occupation}
        />

        <Text style={styles.label}>Please list any medical conditions or injuries</Text>
        <TextInput
          multiline
          style={styles.input}
          onChangeText={(t) => handleChange('medicalConditions', t)}
          value={form.medicalConditions}
        />

        <Text style={styles.label}>Do you currently follow any special diet?</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('specialDiet', t)}
          value={form.specialDiet}
        />

        {/* Lifestyle */}
        <Text style={styles.label}>Training time preference*</Text>
        <TextInput
          multiline
          style={styles.input}
          onChangeText={(t) => handleChange('trainingTimePreference', t)}
          value={form.trainingTimePreference}
        />

        {/* Activity Level */}
        <Text style={styles.label}>
          Which of the following options best describes your activity level (this does NOT include
          exercise)?*
        </Text>
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity
            style={[styles.checkboxContainer, { alignItems: 'flex-start', marginBottom: 10 }]}
            onPress={() => handleChange('activityLevel', 'Sedentary')}>
            <View
              style={[
                styles.checkbox,
                form.activityLevel === 'Sedentary' && styles.checkboxChecked,
              ]}
            />
            <Text style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>Sedentary: </Text>
              (e.g. office job), below 7,500 steps/day
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { alignItems: 'flex-start', marginBottom: 10 }]}
            onPress={() => handleChange('activityLevel', 'Somewhat active')}>
            <View
              style={[
                styles.checkbox,
                form.activityLevel === 'Somewhat active' && styles.checkboxChecked,
              ]}
            />
            <Text style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>Somewhat active: </Text>
              (e.g. you walk your dog several times a day or you commute by bicycle/on foot), 7,500
              – 9,999 steps/day
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { alignItems: 'flex-start', marginBottom: 10 }]}
            onPress={() => handleChange('activityLevel', 'Active')}>
            <View
              style={[styles.checkbox, form.activityLevel === 'Active' && styles.checkboxChecked]}
            />
            <Text style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>Active: </Text>
              (e.g. full-time PT, literally on your feet most of the day), 10,000 – 12,500 steps/day
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { alignItems: 'flex-start' }]}
            onPress={() => handleChange('activityLevel', 'Very active')}>
            <View
              style={[
                styles.checkbox,
                form.activityLevel === 'Very active' && styles.checkboxChecked,
              ]}
            />
            <Text style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>Very active: </Text>
              (e.g. involved in physical labour), over 12,500 steps/day with intensive movement
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stress Level */}
        <Text style={styles.label}>
          Which of the following options best describes your stress level?*
        </Text>
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity
            style={[styles.checkboxContainer, { alignItems: 'flex-start', marginBottom: 10 }]}
            onPress={() => handleChange('stressLevel', 'Stress-free')}>
            <View
              style={[
                styles.checkbox,
                form.stressLevel === 'Stress-free' && styles.checkboxChecked,
              ]}
            />
            <Text style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>Stress-free: </Text>
              (e.g. on holiday)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { alignItems: 'flex-start', marginBottom: 10 }]}
            onPress={() => handleChange('stressLevel', 'Only occasional/mild stress')}>
            <View
              style={[
                styles.checkbox,
                form.stressLevel === 'Only occasional/mild stress' && styles.checkboxChecked,
              ]}
            />
            <Text style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>Only occasional/mild stress: </Text>
              (e.g. student not during exam period)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { alignItems: 'flex-start', marginBottom: 10 }]}
            onPress={() => handleChange('stressLevel', 'Average stress')}>
            <View
              style={[
                styles.checkbox,
                form.stressLevel === 'Average stress' && styles.checkboxChecked,
              ]}
            />
            <Text style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>Average stress: </Text>
              (e.g. full-time work with deadlines/commuting)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { alignItems: 'flex-start' }]}
            onPress={() => handleChange('stressLevel', 'High stress')}>
            <View
              style={[
                styles.checkbox,
                form.stressLevel === 'High stress' && styles.checkboxChecked,
              ]}
            />
            <Text style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>High stress: </Text>
              (e.g. very high-paced work environment with great responsibility)
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Sleep Quality*</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('sleepQuality', t)}
          value={form.sleepQuality}
        />

        <Text style={styles.label}>Caffeine Intake (Daily Avg)</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('caffeineIntake', t)}
          value={form.caffeineIntake}
        />

        <Text style={styles.label}>[Women only] Menstrual Cycle & Contraception</Text>
        <TextInput
          multiline
          style={styles.input}
          onChangeText={(t) => handleChange('menstrualCycle', t)}
          value={form.menstrualCycle}
        />

        {/* Equipment */}
        <Text style={styles.sectionTitle}>4. Equipment</Text>
        <Text style={styles.label}>Do you have access to…</Text>

        <View style={{ marginTop: 10 }}>
          <TouchableOpacity
            style={[styles.checkboxContainer, { marginBottom: 10 }]}
            onPress={() => handleCheckbox('squatRack')}>
            <View style={[styles.checkbox, form.squatRack && styles.checkboxChecked]} />
            <Text style={{ flex: 1 }}>Squat cage or rack</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { marginBottom: 10 }]}
            onPress={() => handleCheckbox('hyperBench')}>
            <View style={[styles.checkbox, form.hyperBench && styles.checkboxChecked]} />
            <Text style={{ flex: 1 }}>45° hyperextension bench</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { marginBottom: 10 }]}
            onPress={() => handleCheckbox('gluteHam')}>
            <View style={[styles.checkbox, form.gluteHam && styles.checkboxChecked]} />
            <Text style={{ flex: 1 }}>Glute-ham raise</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { marginBottom: 10 }]}
            onPress={() => handleCheckbox('standingCalf')}>
            <View style={[styles.checkbox, form.standingCalf && styles.checkboxChecked]} />
            <Text style={{ flex: 1 }}>Standing calf raise machine</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { marginBottom: 10 }]}
            onPress={() => handleCheckbox('dipBelt')}>
            <View style={[styles.checkbox, form.dipBelt && styles.checkboxChecked]} />
            <Text style={{ flex: 1 }}>Dip/chin-up belt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { marginBottom: 10 }]}
            onPress={() => handleCheckbox('legCurl')}>
            <View style={[styles.checkbox, form.legCurl && styles.checkboxChecked]} />
            <Text style={{ flex: 1 }}>Leg curl machine (seated/lying/standing)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { marginBottom: 10 }]}
            onPress={() => handleCheckbox('gymRings')}>
            <View style={[styles.checkbox, form.gymRings && styles.checkboxChecked]} />
            <Text style={{ flex: 1 }}>Gymnastic rings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { marginBottom: 10 }]}
            onPress={() => handleCheckbox('trx')}>
            <View style={[styles.checkbox, form.trx && styles.checkboxChecked]} />
            <Text style={{ flex: 1 }}>TRX or similar suspension device</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { marginBottom: 10 }]}
            onPress={() => handleCheckbox('resistanceBands')}>
            <View style={[styles.checkbox, form.resistanceBands && styles.checkboxChecked]} />
            <Text style={{ flex: 1 }}>Resistance bands</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { marginBottom: 10 }]}
            onPress={() => handleCheckbox('pullUpBar')}>
            <View style={[styles.checkbox, form.pullUpBar && styles.checkboxChecked]} />
            <Text style={{ flex: 1 }}>Pull-up bar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer, { marginBottom: 10 }]}
            onPress={() => handleCheckbox('seatedCalf')}>
            <View style={[styles.checkbox, form.seatedCalf && styles.checkboxChecked]} />
            <Text style={{ flex: 1 }}>seated calf raise machine</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkboxContainer]}
            onPress={() => handleCheckbox('cableTower')}>
            <View style={[styles.checkbox, form.cableTower && styles.checkboxChecked]} />
            <Text style={{ flex: 1 }}>cable tower</Text>
          </TouchableOpacity>
        </View>

        {/* Supplements */}
        <Text style={styles.label}>Please list all the supplements you are currently taking.</Text>
        <TextInput
          multiline
          style={styles.input}
          onChangeText={(t) => handleChange('supplements', t)}
          value={form.supplements}
        />

        {/* Genetics */}
        <Text style={styles.label}>Wrist circumference (smallest point)</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('wristCircumference', t)}
          value={form.wristCircumference}
        />

        <Text style={styles.label}>Ankle circumference (smallest point)</Text>
        <TextInput
          style={styles.input}
          onChangeText={(t) => handleChange('ankleCircumference', t)}
          value={form.ankleCircumference}
        />

        {/* Current Program */}
        <Text style={styles.label}>Describe a typical day of eating (or diet plan)</Text>
        <TextInput
          multiline
          style={styles.input}
          onChangeText={(t) => handleChange('typicalDiet', t)}
          value={form.typicalDiet}
        />

        <Text style={styles.label}>Describe or attach your current training program</Text>
        <TextInput
          multiline
          style={styles.input}
          onChangeText={(t) => handleChange('currentTraining', t)}
          value={form.currentTraining}
        />

        <View style={styles.buttonContainer}>
          <Button title="Submit" onPress={handleSubmit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  label: { marginTop: 15, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
  },
  checkboxGroup: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 3,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007bff',
  },
  checkboxLabel: {
    fontWeight: '600',
  },
  buttonContainer: { marginVertical: 20 },
});
