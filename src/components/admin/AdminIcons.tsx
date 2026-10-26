// Lightweight inline icons for the admin console (stroke style, 24px grid).
type IconProps = { size?: number };

const paths: Record<string, string[]> = {
  overview: ['M4 13h6V4H4z', 'M14 20h6v-9h-6z', 'M14 4h6v4h-6z', 'M4 20h6v-3H4z'],
  Course: ['M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z', 'M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5'],
  Course_Module: ['M12 3 3 8l9 5 9-5z', 'M3 13l9 5 9-5', 'M3 18l9 5 9-5'],
  Student_Enrollment: ['M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20', 'M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M19 8v6', 'M22 11h-6'],
  Lesson_Content: ['M4 4h16v12H4z', 'M10 8.5v4l3.5-2z', 'M8 20h8', 'M12 16v4'],
  Assignment: ['M9 3h6v3H9z', 'M9 4.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1h-3', 'M9 12l2 2 4-4'],
  Assignment_Submission: ['M12 15V3', 'M7 8l5-5 5 5', 'M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4'],
  Certificate: ['M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M8.5 13.5 7 22l5-3 5 3-1.5-8.5'],
  Lead: ['M3 12h4l3 8 4-16 3 8h4'],
  Inquiry: ['M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z'],
  Proposal_Request: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5', 'M9 13h6', 'M9 17h4'],
  'users:Learner': ['M2 9l10-5 10 5-10 5z', 'M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5', 'M22 9v6'],
  'users:Lecturer': ['M3 4h18v11H3z', 'M8 20l4-5 4 5', 'M7 8h6', 'M7 11h4'],
  'users:Admin': ['M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z', 'M9 12l2 2 4-4'],
  impact: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'],
  Announcement: ['M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z', 'M15 8a5 5 0 0 1 0 8', 'M18 5a9 9 0 0 1 0 14'],
  quizzes: ['M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .8-1 1.5V14', 'M12 17.5v.5', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z'],
  gradebook: ['M3 5h18v14H3z', 'M3 10h18', 'M9 5v14', 'M15 5v14'],
  review: ['M9 11l3 3 8-8', 'M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9'],
  discussions: ['M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', 'M8 9h8', 'M8 13h5'],
  journal: ['M4 7h3l2-3h6l2 3h3v12H4z', 'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  audit: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v5h5', 'M12 7v5l3 2'],
  progress: ['M3 3v18h18', 'M7 15l4-4 3 3 5-6'],
  bell: ['M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'],
  check: ['M5 12l5 5L20 7'],
  logout: ['M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3', 'M10 17l-5-5 5-5', 'M5 12h11'],
  arrow: ['M5 12h14', 'M13 6l6 6-6 6'],
  calendar: ['M4 6h16v14H4z', 'M4 10h16', 'M9 3v4', 'M15 3v4'],
  refresh: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4v7h-7'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
};

export function AdminIcon({ name, size = 18 }: IconProps & { name: string }) {
  const d = paths[name] ?? paths.overview;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

export function ZetrcMark({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 22 12 12 22 2 12z" fill="none" stroke="#d9a51f" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" fill="#d9a51f" />
    </svg>
  );
}
