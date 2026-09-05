export default function PageHeader({ eyebrow, title, description }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[13px] font-semibold text-teal">{eyebrow}</p>
      <h1 className="text-[28px] font-bold text-navy">{title}</h1>
      {description && (
        <p className="max-w-[560px] text-[14.5px] text-navy-soft">{description}</p>
      )}
    </div>
  );
}