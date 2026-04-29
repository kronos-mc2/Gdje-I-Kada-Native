import { useRouter } from 'expo-router';

import { AppScreen } from '@/components/primitives';
import { useMyEventsQuery } from '@/core/api/query-hooks';
import { JoinedEventsCalendar } from '@/features/calendar/components/joined-events-calendar';

export default function CalendarScreen() {
  const router = useRouter();
  const { data: joinedEvents = [] } = useMyEventsQuery('joined');

  return (
    <AppScreen scroll contentContainerStyle={{ paddingTop: 4 }}>
      <JoinedEventsCalendar
        events={joinedEvents}
        onOpenEvent={(eventId) => router.push({ pathname: '/event/[id]', params: { id: eventId } })}
      />
    </AppScreen>
  );
}
