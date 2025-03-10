
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  with: string;
};

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Coffee Chat',
      date: 'May 15, 2023',
      time: '10:00 AM - 11:00 AM',
      location: 'Starbucks, Downtown',
      with: 'Sarah Johnson'
    },
    {
      id: '2',
      title: 'Networking Meeting',
      date: 'May 15, 2023',
      time: '2:00 PM - 3:00 PM',
      location: 'Coffee Bean, West Side',
      with: 'Michael Chang'
    },
    {
      id: '3',
      title: 'Career Discussion',
      date: 'May 17, 2023',
      time: '9:00 AM - 10:00 AM',
      location: 'Blue Bottle Coffee',
      with: 'Emily Williams'
    },
  ]);

  // Generate dates for the calendar view
  const getDaysInMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Add previous month days to fill the first week
    const firstDay = date.getDay();
    for (let i = firstDay; i > 0; i--) {
      const prevDate = new Date(year, month, -i + 1);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        hasEvents: false
      });
    }
    
    // Add current month days
    while (date.getMonth() === month) {
      const currentDate = new Date(date);
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        hasEvents: events.some(event => new Date(event.date).toDateString() === currentDate.toDateString())
      });
      date.setDate(date.getDate() + 1);
    }
    
    // Add next month days to fill the last week
    const lastDay = days[days.length - 1].date.getDay();
    for (let i = 1; i < 7 - lastDay; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        hasEvents: false
      });
    }
    
    return days;
  };
  
  const days = getDaysInMonth();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };
  
  const filteredEvents = events.filter(
    event => new Date(event.date).toDateString() === selectedDate.toDateString()
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
      </View>
      
      <View style={[styles.calendarHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigateMonth(-1)}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.monthYear, { color: colors.text }]}>
          {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>
        
        <TouchableOpacity onPress={() => navigateMonth(1)}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.calendarGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.weekdayHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={[styles.weekday, { color: colors.secondaryText }]}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.daysGrid}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                day.date.toDateString() === selectedDate.toDateString() && 
                  { backgroundColor: colors.primary, borderRadius: 20 }
              ]}
              onPress={() => setSelectedDate(day.date)}
            >
              <Text 
                style={[
                  styles.dayNumber,
                  { color: day.isCurrentMonth ? 
                    (day.date.toDateString() === selectedDate.toDateString() ? '#FFFFFF' : colors.text) : 
                    colors.secondaryText 
                  }
                ]}
              >
                {day.date.getDate()}
              </Text>
              {day.hasEvents && day.date.toDateString() !== selectedDate.toDateString() && (
                <View style={[styles.eventDot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.eventsHeader}>
        <Text style={[styles.eventsTitle, { color: colors.text }]}>
          Events for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
      
      <ScrollView style={styles.eventsContainer}>
        {filteredEvents.length > 0 ? (
          filteredEvents.map(event => (
            <View key={event.id} style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.eventTime}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={[styles.timeText, { color: colors.text }]}>{event.time}</Text>
              </View>
              
              <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
              
              <View style={styles.eventDetail}>
                <Ionicons name="location-outline" size={18} color={colors.secondaryText} />
                <Text style={[styles.detailText, { color: colors.secondaryText }]}>{event.location}</Text>
              </View>
              
              <View style={styles.eventDetail}>
                <Ionicons name="person-outline" size={18} color={colors.secondaryText} />
                <Text style={[styles.detailText, { color: colors.secondaryText }]}>With: {event.with}</Text>
              </View>
              
              <View style={styles.eventActions}>
                <TouchableOpacity style={[styles.actionButton, { borderColor: colors.primary }]}>
                  <Text style={[styles.actionText, { color: colors.primary }]}>Reschedule</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.actionButton, { borderColor: colors.primary }]}>
                  <Text style={[styles.actionText, { color: colors.primary }]}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noEvents}>
            <Ionicons name="calendar-outline" size={48} color={colors.secondaryText} />
            <Text style={[styles.noEventsText, { color: colors.secondaryText }]}>No events scheduled</Text>
            <TouchableOpacity style={[styles.scheduleButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.scheduleButtonText}>Schedule Coffee Meeting</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'K2D-Bold',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  monthYear: {
    fontSize: 18,
    fontFamily: 'K2D-SemiBold',
  },
  calendarGrid: {
    marginTop: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'K2D-Medium',
    paddingVertical: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 6,
  },
  eventsHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  eventsTitle: {
    fontSize: 18,
    fontFamily: 'K2D-SemiBold',
  },
  eventsContainer: {
    padding: 16,
    paddingTop: 0,
    flex: 1,
  },
  eventCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontFamily: 'K2D-Medium',
    fontSize: 16,
    marginLeft: 8,
  },
  eventTitle: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 18,
    marginBottom: 12,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontFamily: 'K2D-Regular',
    marginLeft: 8,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 0.48,
  },
  actionText: {
    fontFamily: 'K2D-Medium',
  },
  noEvents: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noEventsText: {
    fontFamily: 'K2D-Medium',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  scheduleButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  scheduleButtonText: {
    color: '#FFFFFF',
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
  },
});
