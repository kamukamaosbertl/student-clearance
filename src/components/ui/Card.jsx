export default function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "flex flex-col gap-[18px] rounded-card border border-border bg-white px-[30px] py-[26px]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}