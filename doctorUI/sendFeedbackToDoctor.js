import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons"; // for using delete and edit icons
import firestore from '@react-native-firebase/firestore'; // Firebase Firestore
import auth from '@react-native-firebase/auth'; // Firebase Authentication

const ScheduleTime = () => {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [slotsByDate, setSlotsByDate] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState("time");
  const [editingSlot, setEditingSlot] = useState(null);

  // Firebase Reference to 'schedules' collection
  const scheduleCollection = firestore().collection('schedules');

  // Get current authenticated user's email
  const user = auth().currentUser;

  if (!user) {
    Alert.alert("Not Authenticated", "You must be logged in to schedule.");
    return null; // Return nothing if not authenticated
  }

  const userEmail = user.email; // Use email or UID to save data

  // Generate next n days (more than 7 days)
  const getNextNDays = (n) => {
    const daysArray = [];
    const today = new Date();

    for (let i = 0; i < n; i++) {
      const currentDay = new Date();
      currentDay.setDate(today.getDate() + i);
      const fullDate = currentDay.toLocaleDateString();
      const monthName = currentDay.toLocaleString('default', { month: 'long' });
      daysArray.push({
        day: currentDay.toLocaleDateString("en-US", { weekday: "short" }),
        month: monthName, // Month name
        date: currentDay.getDate(),
        fullDate,
      });

      // Initialize slots for each day if not already initialized
      if (!slotsByDate[fullDate]) {
        slotsByDate[fullDate] = { daySlots: [], nightSlots: [] };
      }
    }

    return daysArray;
  };

  const days = getNextNDays(30); // Example: Generates next 365 days

  // Fetch schedule data from Firestore for initial setup (if any)
  useEffect(() => {
    const fetchSchedule = async () => {
      const scheduleSnapshot = await scheduleCollection
        .doc(userEmail) // Use user email as the document ID
        .get();

      const scheduleData = scheduleSnapshot.data();
      if (scheduleData) {
        setSlotsByDate(scheduleData);
      }
    };

    fetchSchedule();
  }, [userEmail]);

  const saveSchedule = async () => {
    const selectedDate = days[selectedDateIndex].fullDate;
    const slots = slotsByDate[selectedDate];
    try {
      // Loop through all days and apply the same slots for matching days
      const updatedSlots = { ...slotsByDate };
      days.forEach((day) => {
        if (day.day === days[selectedDateIndex].day) {
          updatedSlots[day.fullDate] = { ...slots };
        }
      });

      await scheduleCollection.doc(userEmail).set(updatedSlots); // Save schedule under user's email
      setSlotsByDate(updatedSlots);
      Alert.alert("Schedule Saved", `Your slots for ${selectedDate} have been successfully saved!`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save schedule.");
    }
  };

  const showTimePicker = () => {
    setMode("time");
    setShowPicker(true);
  };

  const onTimeChange = (event, selectedTime) => {
    setShowPicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      const formattedTime = `${(hours % 12 || 12)
        .toString()
        .padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${
        hours >= 12 ? "PM" : "AM"
      }`;

      const newSlot = { id: `${Date.now()}`, time: formattedTime };
      const currentDate = days[selectedDateIndex].fullDate;
      const updatedSlots = { ...slotsByDate };

      if (hours >= 6 && hours < 18) {
        updatedSlots[currentDate].daySlots.push(newSlot);
      } else {
        updatedSlots[currentDate].nightSlots.push(newSlot);
      }

      setSlotsByDate(updatedSlots);
      Alert.alert("Slot Added", `Slot "${formattedTime}" has been added successfully.`);
    }
  };

  const currentSlots = slotsByDate[days[selectedDateIndex]?.fullDate] || {
    daySlots: [],
    nightSlots: [],
  };

  const deleteSlot = async (slotTime, isDaySlot) => {
    const currentDate = days[selectedDateIndex].fullDate;
    const updatedSlots = { ...slotsByDate };
    if (isDaySlot) {
      updatedSlots[currentDate].daySlots = updatedSlots[currentDate].daySlots.filter(
        (slot) => slot.time !== slotTime
      );
    } else {
      updatedSlots[currentDate].nightSlots = updatedSlots[currentDate].nightSlots.filter(
        (slot) => slot.time !== slotTime
      );
    }

    setSlotsByDate(updatedSlots);

    // Save updated schedule to Firestore
    try {
      await scheduleCollection.doc(userEmail).set(updatedSlots);
      Alert.alert("Slot Deleted", `Slot "${slotTime}" has been deleted successfully.`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete slot.");
    }
  };

  const editSlot = (slotTime, isDaySlot) => {
    setEditingSlot({ time: slotTime, isDaySlot });
    showTimePicker();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule Your Availability</Text>

      {/* Month Display */}
      <Text style={styles.monthText}>
        {days[selectedDateIndex]?.month} {/* Displaying month separately */}
      </Text>

      {/* Date Selection */}
      <View style={styles.dateContainer}>
        <FlatList
          data={days}
          horizontal={true} // Enable horizontal scrolling
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.dateBox, selectedDateIndex === index && styles.selectedDateBox]}
              onPress={() => setSelectedDateIndex(index)}
            >
              <Text style={styles.day}>{item.day}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.fullDate}
        />
      </View>

      {/* Add Slot Button */}
      <TouchableOpacity style={styles.addSlotButton} onPress={showTimePicker}>
        <Text style={styles.addSlotButtonText}>Add Slot</Text>
      </TouchableOpacity>

      {/* Time Picker */}
      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode={mode}
          is24Hour={false}
          display="default"
          onChange={onTimeChange}
        />
      )}

      {/* Day Slots */}
      <Text style={styles.sectionTitle}>Day Slots</Text>
      <FlatList
        data={currentSlots.daySlots}
        numColumns={3} // 3 slots per row
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slotButton}>
            <Text style={styles.slotText}>{item.time}</Text>
            <View style={styles.iconsContainer}>
              <TouchableOpacity onPress={() => editSlot(item.time, true)} style={styles.iconButton}>
                <Ionicons name="pencil" size={20} color="orange" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteSlot(item.time, true)} style={styles.iconButton}>
                <Ionicons name="trash" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Night Slots */}
      <Text style={styles.sectionTitle}>Night Slots</Text>
      <FlatList
        data={currentSlots.nightSlots}
        numColumns={3} // 3 slots per row
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slotButton}>
            <Text style={styles.slotText}>{item.time}</Text>
            <View style={styles.iconsContainer}>
              <TouchableOpacity onPress={() => editSlot(item.time, false)} style={styles.iconButton}>
                <Ionicons name="pencil" size={20} color="orange" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteSlot(item.time, false)} style={styles.iconButton}>
                <Ionicons name="trash" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Save Schedule Button */}
      <TouchableOpacity style={styles.saveButton} onPress={saveSchedule}>
        <Text style={styles.saveText}>Save Schedule</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 20,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  dateBox: {
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    width: 60,
    marginHorizontal: 5,
  },
  selectedDateBox: {
    backgroundColor: "#007bff",
  },
  day: {
    fontSize: 14,
    color: "#6c757d",
  },
  date: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  addSlotButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  addSlotButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginVertical: 10,
  },
  slotButton: {
    flex: 1,
    margin: 5,
    paddingVertical: 3,
    backgroundColor: "#FFFF00",
    borderRadius: 5,
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1,
  },
  slotText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "bold",
  },
  iconsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 5,
  },
  iconButton: {
    padding: 5,
  },
  saveButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#28a745",
    borderRadius: 5,
    alignItems: "center",
  },
  saveText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ScheduleTime;
