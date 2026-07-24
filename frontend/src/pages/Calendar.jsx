import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useApp } from "../context/AppContext";
import { CreateModal } from "../components/CreateModal";

export const Calendar = ({ onShowToast }) => {
  const { state, applyCrmChange } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const monthEvents = state.activities.filter((activity) => {
    if (activity.type === "event" && activity.startDateTime) {
      const eventDate = new Date(activity.startDateTime);
      return isSameMonth(eventDate, currentDate);
    }
    return false;
  });

  const getEventsForDay = (day) =>
    monthEvents.filter((event) => event.startDateTime && isSameDay(new Date(event.startDateTime), day));

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDayClick = (day) => {
    onShowToast(`Selected date: ${day.toDateString()}`, "info");
  };

  const eventFields = [
    { name: "subject", label: "Subject", type: "text", required: true },
    { name: "startDateTime", label: "Start Date & Time", type: "text", required: true },
    { name: "endDateTime", label: "End Date & Time", type: "text", required: true },
    { name: "location", label: "Location", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
  ];

  const handleCreateEvent = async (data) => {
    const newEvent = {
      activityId: `event_${Date.now()}`,
      subject: data.subject,
      type: "event",
      startDateTime: new Date(data.startDateTime).toISOString(),
      endDateTime: new Date(data.endDateTime).toISOString(),
      location: data.location || "",
      description: data.description || "",
      status: "Scheduled",
      priority: "Normal",
      relatedToType: "Calendar",
      relatedToId: "",
      assignedToId: state.user.userId,
      createdDate: new Date().toISOString(),
    };

    try {
      await applyCrmChange({ activities: [...state.activities, newEvent] });
      onShowToast("Event created successfully.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to create event.", "error");
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Calendar</h1>
        <button className="btn btn-primary" onClick={() => setShowEventModal(true)}>
          <Plus size={18} />
          New Event
        </button>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <button onClick={handlePrevMonth} className="btn btn-secondary">
            <ChevronLeft size={20} />
          </button>
          <h2 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button onClick={handleNextMonth} className="btn btn-secondary">
            <ChevronRight size={20} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "1px",
            background: "var(--border)",
            border: "1px solid var(--border)",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              style={{
                background: "var(--bg)",
                padding: "12px",
                textAlign: "center",
                fontWeight: 600,
                fontSize: "12px",
                textTransform: "uppercase",
              }}
            >
              {day}
            </div>
          ))}

          {daysInMonth.map((day) => {
            const events = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                style={{
                  background: "white",
                  padding: "8px",
                  minHeight: "100px",
                  cursor: "pointer",
                  border: isToday ? "2px solid var(--primary)" : "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "var(--hover)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "white";
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>{format(day, "d")}</div>
                {events.slice(0, 3).map((event, index) => (
                  <div
                    key={`${event.activityId}-${index}`}
                    style={{
                      background: "var(--primary)",
                      color: "white",
                      padding: "2px 4px",
                      borderRadius: "3px",
                      fontSize: "10px",
                      marginBottom: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {event.subject}
                  </div>
                ))}
                {events.length > 3 && (
                  <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                    +{events.length - 3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Upcoming Events</h3>
        {state.activities
          .filter((activity) => activity.type === "event")
          .slice(0, 5)
          .map((event) => (
            <div
              key={event.activityId}
              style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}
            >
              <div style={{ fontWeight: 600 }}>{event.subject}</div>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                {event.startDateTime ? format(new Date(event.startDateTime), "MMM d, yyyy h:mm a") : "No date"}
              </div>
            </div>
          ))}
      </div>

      <CreateModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="Create New Event"
        fields={eventFields}
        onSubmit={handleCreateEvent}
      />
    </div>
  );
};
