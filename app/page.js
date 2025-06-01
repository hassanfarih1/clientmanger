import Clients from "./components/clients";
import Hero from "./components/hero";
import Navbar from "./components/navbar";
import Transactions from "./components/transactions";

export default function Home() {
  return (
    <div>
      <Navbar />
      <Hero/>
      <div className="flex flex-col md:flex-row gap-4 px-4 mt-6">
        <Clients />
        <Transactions />
      </div>
    </div>
  );
}
