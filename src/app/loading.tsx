export default function Loading() {
  return (
    <main className="px-4 py-12 sm:px-6 lg:px-10" aria-label="Carregando conteúdo" aria-busy="true">
      <div className="mx-auto max-w-[1220px] animate-pulse">
        <div className="h-3 w-32 rounded-full bg-lilac" />
        <div className="mt-5 h-14 max-w-2xl rounded-xl bg-line" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="aspect-[3/4] rounded-card bg-line" />)}
        </div>
      </div>
    </main>
  );
}
