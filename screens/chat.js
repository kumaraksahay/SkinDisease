import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const stories = [
  { id: '1', name: 'Your Story' },
  { id: '2', name: 'Khalil' },
  { id: '3', name: 'Faseel' },
  { id: '4', name: 'Yaqoob' },
  { id: '5', name: 'Sabeel' },
  { id: '6', name: 'Shakeel' },
];

const chats = [
  {
    id: '1',
    name: 'Khalil Baloch',
    message: 'Of course, what can I help you...',
    time: '2 min ago',
    unread: 3,
    image: require('../src/assets/doct.png'),
  },
  {
    id: '2',
    name: 'Faseel Baloch',
    message: "I'll see you next week in our...",
    time: '07:40',
    unread: 0,
    image: require('../src/assets/doct.png'),
  },
  {
    id: '3',
    name: 'Shakeel Baloch',
    message: "Okay, let's connect in someti...",
    time: '06:21',
    unread: 4,
    image: require('../src/assets/doct.png'),
  },
  {
    id: '4',
    name: 'Sabeel Baloch',
    message: 'Okay, I will work on that.',
    time: 'Yesterday',
    unread: 0,
    image: require('../src/assets/doct.png'),
  },
  {
    id: '5',
    name: 'Dr.Abdul Rehman',
    message: 'Goa ki ticket karwao, jaldi!',
    time: 'Yesterday',
    unread: 0,
    image: require('../src/assets/doct.png'),
  },
];

const ChatScreen = () => {
  return (
    <View style={styles.container}>
      {/* Stories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer}>
        {stories.map((story) => (
          <View key={story.id} style={styles.story}>
            <View style={styles.storyCircle}>
              <Icon name="person-circle-outline" size={55} color="#aaa" />
            </View>
            <Text style={styles.storyText}>{story.name}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#888" style={{ marginHorizontal: 10 }} />
        <TextInput placeholder="Search" style={styles.searchInput} />
      </View>

      {/* Chat List */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatItem}>
            <Image source={item.image} style={styles.avatar} />
            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <View style={styles.chatFooter}>
                <Text style={styles.message}>{item.message}</Text>
                {item.unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  storiesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: '#b076ff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  story: {
    alignItems: 'center',
    marginRight: 15,
  },
  storyCircle: {
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 2,
  },
  storyText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    margin: 15,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  chatContent: {
    flex: 1,
    marginLeft: 15,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  time: {
    color: '#999',
    fontSize: 12,
  },
  message: {
    color: '#666',
    flex: 1,
    fontSize: 14,
  },
  badge: {
    backgroundColor: 'green',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
  },
});
