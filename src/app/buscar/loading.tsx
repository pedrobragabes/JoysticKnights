export default function SearchLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Carregando resultados da busca">
      <div className="border-b border-line bg-surface px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1220px]">
          <div className="h-3 w-20 rounded-full bg-line" />
          <div className="mt-5 h-14 max-w-2xl rounded-card bg-line sm:h-20" />
          <div className="mt-5 h-5 max-w-lg rounded-full bg-line" />
        </div>
      </div>
      <div className="px-4 py-12 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1220px] gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-80 rounded-card bg-line" />)}
        </div>
      </div>
    </div>
  );
}
