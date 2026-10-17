import './speed-demo.css';

function TaskIcon({ task }: { task: number }) {
  return <g fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    {task === 0 && <><circle cx="-3" cy="-3" r="9" /><path d="m4 4 8 8" /></>}
    {task === 1 && <><rect x="-12" y="-15" width="24" height="30" rx="3" /><path d="M-6-6H6M-6 0H6M-6 6H2" /></>}
    {task === 2 && <><path d="M-5 10V-10l18-4V6M-5-4l18-4" /><ellipse cx="-10" cy="11" rx="5" ry="4" fill="currentColor" stroke="none" /><ellipse cx="8" cy="7" rx="5" ry="4" fill="currentColor" stroke="none" /></>}
  </g>;
}

function Pointer({ pixie }: { pixie: boolean }) {
  return <g className={`speed-pointer ${pixie ? 'pointer-pixie' : 'pointer-you'}`}>
    <path d="M0 0v27l7-7 7 14 6-3-7-14h13Z" fill="#161715" stroke="#faf9f6" strokeWidth="2.5" strokeLinejoin="round" />
    {pixie && <g transform="translate(24 24)">
      <rect width="38" height="24" rx="8" fill="#151714" />
      <g fill="#d1efb0" className="speed-pixel-eyes">
        <path d="M9 6h6v2h2v8h-2v2H9v-2H7V8h2Zm14 0h6v2h2v8h-2v2h-6v-2h-2V8h2Z" />
        <path d="M11 10h4v4h-4Zm14 0h4v4h-4Z" fill="#151714" />
      </g>
    </g>}
  </g>;
}

export function SpeedDemo({ reducedMotion }: { reducedMotion: boolean }) {
  return <svg className={`speed-demo ${reducedMotion ? 'is-still' : ''}`} viewBox="0 0 580 230" role="img" aria-label="Illustration: your cursor searches, takes a note, and plays music. Pixie's cursor completes the same three tasks sooner, then waits.">
    {['you', 'pixie'].map((who, row) => <g key={who} className={`speed-lane lane-${who}`} transform={`translate(0 ${row * 112})`}>
      <text x="17" y="61" className="speed-label">{who === 'you' ? 'You' : 'Pixie'}</text>
      <path d="M179 55H421" stroke="#deded7" strokeWidth="1.5" strokeDasharray="2 7" />
      {[0, 1, 2].map((task) => <g key={task} transform={`translate(${179 + task * 120} 55)`} className={`speed-task task-${task}`}>
        <rect x="-31" y="-31" width="62" height="62" rx="16" fill="#faf9f6" stroke="#d4d5ce" />
        <rect className="task-complete" x="-31" y="-31" width="62" height="62" rx="16" fill="#d1efb0" stroke="#b7d79b" />
        <TaskIcon task={task} />
        <g className="task-complete"><circle cx="25" cy="-25" r="10" fill="#222b1c" /><path d="m21-25 3 3 5-6" fill="none" stroke="#fffefa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></g>
      </g>)}
      <Pointer pixie={who === 'pixie'} />
    </g>)}
  </svg>;
}
