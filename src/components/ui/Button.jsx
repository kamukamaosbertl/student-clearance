export default function Button({ variant = "primary", className = "", children, ...buttonProps }) {
  const base =
    "rounded-field px-5 py-2.5 text-[14px] font-medium " +
    "transition-all duration-150 ease-out " +   // animate everything, not just color
    "hover:-translate-y-0.5 hover:shadow-md " + // lifts slightly on hover
    "active:translate-y-0 active:shadow-sm " +  // presses back down on click
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"; // keyboard users need this too

  const variants = {
    primary: "bg-teal text-white hover:bg-teal-dark focus-visible:ring-teal",
    secondary: "border border-border bg-white text-navy hover:bg-surface focus-visible:ring-teal",
  };

  return (
    <button className={[base, variants[variant], className].join(" ")} {...buttonProps}>
      {children}
    </button>
  );
}