export default function Skeleton({ className, style, ...props }) {
  return (
    <div className={`loading-skeleton ${className || ""}`} style={style} {...props} />
  );
}
