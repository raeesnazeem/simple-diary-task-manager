import Header from "../src/components/Header";
import BlockEditor from "../src/components/BlockEditor";
import GlobalSearch from "../src/components/GlobalSearch";

export default function Home() {
  return (
    <div className="flex h-screen flex-col bg-[#f5f5f5] overflow-hidden">
      <Header />

      <main className="flex-1 overflow-y-auto w-full py-12 px-4 scroll-smooth">
        <div className="mx-auto w-full max-w-4xl paper-canvas min-h-[85vh] rounded-xl relative p-10 md:p-16 lg:p-20">
          <BlockEditor />
        </div>
      </main>

      <GlobalSearch />
    </div>
  );
}
