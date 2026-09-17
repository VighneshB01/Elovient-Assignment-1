/**
 * Spinner — uses pure CSS class (no Tailwind) for consistency with new design system.
 * Props: size ('sm' | 'md' | 'lg'), center (bool)
 */
function Spinner({ size = 'md', center = false }) {
  const cls = `spinner spinner-${size}`;
  if (center) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
        <span className={cls} aria-label="Loading" />
      </div>
    );
  }
  return <span className={cls} aria-label="Loading" />;
}

export default Spinner;
