export default function StoryLoading() {
  return (
    <div className="animate-pulse px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1220px]">
        <div className="h-5 w-28 rounded-full bg-line" />
        <div className="mt-7 h-16 max-w-4xl rounded-card bg-line sm:h-28" />
        <div className="mt-5 h-7 max-w-2xl rounded bg-line" />
        <div className="mt-10 aspect-video rounded-card bg-line" />
      </div>
    </div>
  );
}
