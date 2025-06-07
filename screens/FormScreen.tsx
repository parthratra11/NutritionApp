import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Button, KeyboardAvoidingView, Platform } from 'react-native';

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
    // Photos: handled separately
  });

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    console.log(form);
    // Here you would typically send the data to your backend
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.title}>Online Coaching Client Intake Form</Text>

        {/* Personal Info */}
        <Text style={styles.label}>Full name*</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('fullName', text)} value={form.fullName} />

        <Text style={styles.label}>Street and house number</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('street', text)} value={form.street} />

        <Text style={styles.label}>Postal code</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('postalCode', text)} value={form.postalCode} />

        <Text style={styles.label}>City*</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('city', text)} value={form.city} />

        <Text style={styles.label}>Country*</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('country', text)} value={form.country} />

        <Text style={styles.label}>Age*</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('age', text)} value={form.age} keyboardType="numeric" />

        <Text style={styles.label}>Height*</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('height', text)} value={form.height} />

        <Text style={styles.label}>Weight*</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('weight', text)} value={form.weight} />

        <Text style={styles.label}>Body fat percentage (plus estimation method)</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('bodyFat', text)} value={form.bodyFat} />

        <Text style={styles.label}>Do you have experience with strength training?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('strengthTrainingExperience', text)} value={form.strengthTrainingExperience} />

        {/* Strength */}
        <Text style={styles.label}>Barbell Bench Press (kg x reps)</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('benchPress', text)} value={form.benchPress} />

        <Text style={styles.label}>Back Squat (kg x reps)</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('squat', text)} value={form.squat} />

        <Text style={styles.label}>Chin-up (kg x reps)</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('chinUp', text)} value={form.chinUp} />

        <Text style={styles.label}>Deadlift (kg x reps)</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('deadlift', text)} value={form.deadlift} />

        <Text style={styles.label}>Barbell Overhead Press (kg x reps)</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('overheadPress', text)} value={form.overheadPress} />

        <Text style={styles.label}>How would you rate your competency on the aforementioned exercises?*</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('exerciseCompetency', text)} value={form.exerciseCompetency} />

        {/* Goals */}
        <Text style={styles.label}>What are your top 3 goals?*</Text>
        <TextInput multiline style={styles.input} onChangeText={text => handleChange('goals', text)} value={form.goals} />

        <Text style={styles.label}>What is your number 1 obstacle?*</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('obstacle', text)} value={form.obstacle} />

        <Text style={styles.label}>Will you be performing any other form of exercise alongside strength training?*</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('otherExercises', text)} value={form.otherExercises} />

        <Text style={styles.label}>What’s your dedication level?*</Text>
        <TextInput multiline style={styles.input} onChangeText={text => handleChange('dedicationLevel', text)} value={form.dedicationLevel} />

        <Text style={styles.label}>How often in a week would you be prepared to train for maximal results?*</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('weeklyFrequency', text)} value={form.weeklyFrequency} />

        {/* Misc */}
        <Text style={styles.label}>What is your occupation?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('occupation', text)} value={form.occupation} />

        <Text style={styles.label}>Please list any medical conditions or injuries</Text>
        <TextInput multiline style={styles.input} onChangeText={text => handleChange('medicalConditions', text)} value={form.medicalConditions} />

        <Text style={styles.label}>Do you currently follow any special diet?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('specialDiet', text)} value={form.specialDiet} />

        {/* Lifestyle */}
        <Text style={styles.label}>Training time preference*</Text>
        <TextInput multiline style={styles.input} onChangeText={text => handleChange('trainingTimePreference', text)} value={form.trainingTimePreference} />

        <Text style={styles.label}>Activity Level*</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('activityLevel', text)} value={form.activityLevel} />

        <Text style={styles.label}>Stress Level*</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('stressLevel', text)} value={form.stressLevel} />

        <Text style={styles.label}>Sleep Quality*</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('sleepQuality', text)} value={form.sleepQuality} />

        <Text style={styles.label}>Caffeine Intake (Daily Avg)</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('caffeineIntake', text)} value={form.caffeineIntake} />

        <Text style={styles.label}>[Women only] Menstrual Cycle & Contraception</Text>
        <TextInput multiline style={styles.input} onChangeText={text => handleChange('menstrualCycle', text)} value={form.menstrualCycle} />

        {/* Equipment */}
        <Text style={styles.label}>Do you have skinfold calipers? If so, which one(s)?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('calipers', text)} value={form.calipers} />

        <Text style={styles.label}>Do you have a MyoTape?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('myoTape', text)} value={form.myoTape} />

        <Text style={styles.label}>Fitness Technology (Apple Watch, etc.)</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('fitnessTech', text)} value={form.fitnessTech} />

        <Text style={styles.label}>Do you have access to any cardio equipment at home?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('cardioEquipment', text)} value={form.cardioEquipment} />

        <Text style={styles.label}>Do you have access to a squat cage or rack?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('squatRack', text)} value={form.squatRack} />

        <Text style={styles.label}>45° hyperextension bench?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('hyperBench', text)} value={form.hyperBench} />

        <Text style={styles.label}>Glute-ham raise?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('gluteHam', text)} value={form.gluteHam} />

        <Text style={styles.label}>Standing calf raise machine?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('standingCalf', text)} value={form.standingCalf} />

        <Text style={styles.label}>Dip/chin-up belt?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('dipBelt', text)} value={form.dipBelt} />

        <Text style={styles.label}>Leg curl machine (seated/lying/standing)?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('legCurl', text)} value={form.legCurl} />

        <Text style={styles.label}>Gymnastic rings?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('gymRings', text)} value={form.gymRings} />

        <Text style={styles.label}>TRX or similar suspension device?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('trx', text)} value={form.trx} />

        <Text style={styles.label}>Resistance bands?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('resistanceBands', text)} value={form.resistanceBands} />

        <Text style={styles.label}>Pull-up bar?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('pullUpBar', text)} value={form.pullUpBar} />

        <Text style={styles.label}>Seated calf raise machine?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('seatedCalf', text)} value={form.seatedCalf} />

        <Text style={styles.label}>Cable tower (is it adjustable)?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('cableTower', text)} value={form.cableTower} />

        <Text style={styles.label}>Other equipment or differences from most gyms?</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('otherEquipment', text)} value={form.otherEquipment} />

        {/* Supplements */}
        <Text style={styles.label}>Please list all the supplements you are currently taking.</Text>
        <TextInput multiline style={styles.input} onChangeText={text => handleChange('supplements', text)} value={form.supplements} />

        {/* Genetics */}
        <Text style={styles.label}>Wrist circumference (smallest point)</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('wristCircumference', text)} value={form.wristCircumference} />

        <Text style={styles.label}>Ankle circumference (smallest point)</Text>
        <TextInput style={styles.input} onChangeText={text => handleChange('ankleCircumference', text)} value={form.ankleCircumference} />

        {/* Current Program */}
        <Text style={styles.label}>Describe a typical day of eating (or diet plan)</Text>
        <TextInput multiline style={styles.input} onChangeText={text => handleChange('typicalDiet', text)} value={form.typicalDiet} />

        <Text style={styles.label}>Describe or attach your current training program</Text>
        <TextInput multiline style={styles.input} onChangeText={text => handleChange('currentTraining', text)} value={form.currentTraining} />

        <View style={{ marginVertical: 20 }}>
          <Button title="Submit" onPress={handleSubmit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { marginTop: 15, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
  },
});
