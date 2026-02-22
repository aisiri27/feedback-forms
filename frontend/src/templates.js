export const templates = {
  contact: {
    title: "Contact Information",
    description: "Collect contact details",
    questions: [
      {
        id: 1,
        type: "short_answer",
        title: "Full Name",
        required: true,
      },
      {
        id: 2,
        type: "short_answer",
        title: "Email Address",
        required: true,
      },
      {
        id: 3,
        type: "short_answer",
        title: "Phone Number",
        required: false,
      },
    ],
  },

  feedback: {
    title: "Event Feedback",
    description: "Help us improve",
    questions: [
      {
        id: 1,
        type: "multiple_choice",
        title: "How was the event?",
        options: ["Excellent", "Good", "Average", "Poor"],
        required: true,
      },
      {
        id: 2,
        type: "paragraph",
        title: "Suggestions for improvement",
        required: false,
      },
    ],
  },

  rsvp: {
    title: "RSVP Form",
    description: "Confirm your attendance",
    questions: [
      {
        id: 1,
        type: "short_answer",
        title: "Your Name",
        required: true,
      },
      {
        id: 2,
        type: "yes_no",
        title: "Will you attend?",
        required: true,
      },
    ],
  },
};
