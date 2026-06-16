import Image from "next/image";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden font-sans text-white">
      
      {/* Background Layer: Your Figma Masterpiece */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image 
          src="/sky.png" /* Change to .png if your file is a png! */
          alt="Zenith OS Sky Background"
          fill
          className="object-cover"
          priority /* Tells Next.js to load this instantly, no lazy-loading */
        />
      </div>

      {/* App Layer: Where the Zenith windows will live */}
      <div className="relative z-10 w-full h-full p-8 flex items-center justify-center">
        
        {/* We will replace this text with our 3D Window next! */}
        <h1 className="text-4xl font-bold tracking-widest drop-shadow-md animate-pulse">
          ZENITH OS // BOOTING...
        </h1>
        
      </div>
      
    </main>
  );
}