export interface SuggestedProject {
  name: string;
  description: string;
  color: string;
  icon: string;
}

export const suggestedProjects: SuggestedProject[] = [
  {
    name: 'Work',
    description: 'Professional work and meetings',
    color: '#007AFF',
    icon: 'flat-color-icons:briefcase',
  },
  {
    name: 'Learning',
    description: 'Courses, reading, skill development',
    color: '#34C759',
    icon: 'flat-color-icons:reading',
  },
  {
    name: 'Side Project',
    description: 'Personal projects and experiments',
    color: '#FC4C02',
    icon: 'flat-color-icons:electronics',
  },
  {
    name: 'Fitness',
    description: 'Workouts and training',
    color: '#FF3B30',
    icon: 'flat-color-icons:sports-mode',
  },
  {
    name: 'Creative Work',
    description: 'Design, writing, art',
    color: '#AF52DE',
    icon: 'flat-color-icons:gallery',
  },
];
