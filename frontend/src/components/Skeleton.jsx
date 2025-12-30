export default function Skeleton({ className = 'h-4 bg-gray-200 rounded', style = {} }) {
  return (
    <div className={`animate-pulse ${className}`} style={style} />
  );
}
