import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { Link } from "react-router-dom";

export default function Home() {
  // const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="auth-container">
      <h1>Welcome 🎉</h1>

      <p className="user-email">
        {auth.currentUser?.email}
      </p>

      <button onClick={() => signOut(auth)}>
        Logout
      </button>
    
<div className="home-navigation">
  <Link to="/recipes" className="home-nav-btn recipes-btn">
    Explore Recipes
    <span>→</span>
  </Link>

  <Link to="/favorites" className="home-nav-btn favorites-btn">
    My Favorites
  </Link>
</div>


    </div>
      {/* Bento Grid Layout - Mobile Optimized */}
      <section className="container px-4 py-4">
        {/* <h2 className="text-4xl font-bold mb-12 text-center">Welcome to Our App</h2> */}
        <div className="grid 
              grid-cols-2 /* Mobile: 2 columns */
              md:grid-cols-2 /* Medium screens: 2 columns */
              lg:grid-cols-2 /* Large screens: 2 columns */
              gap-4 
              grid-flow-dense">
          {/* Row 1: Vertical tall card on left, square on right */}
          <div className="aspect-ratio-4/3 row-span-2 bg-slate-800 rounded-xl p-4">
            <h3 className="text-xl font-bold mb-3 text-blue-400">Vertical rectangle card</h3>
          </div>

          {/* Row 1: Square on right */}
          <div className="aspect-square bg-slate-800 rounded-xl p-4">
            <h3 className="text-2xl font-bold mb-3 text-green-400">🔒 Secure & Safe</h3>
            <p className="text-slate-400 leading-relaxed">
              Built with security best practices and industry-standard protection.
            </p>
          </div>
          {/* Row 1: Square on right */}
          <div className="aspect-square bg-slate-800 rounded-xl p-4">
            <h3 className="text-2xl font-bold mb-3 text-green-400">🔒 Secure & Safe</h3>
            <p className="text-slate-400 leading-relaxed">
              Built with security best practices and industry-standard protection.
            </p>
          </div>

          {/* Row 2: Square */}
          <div className="col-span-full md:col-span-2 
                 aspect-ratio-2/1 bg-slate-800 rounded-xl p-4">
            <h3 className="text-2xl font-bold mb-3 text-purple-400">🎨 Beautiful Design</h3>
            <p className="text-slate-400 leading-relaxed">
              Clean, modern aesthetics powered by TailwindCSS utilities.
            </p>

          </div>






        </div>
      </section>
    </div>
  );
}