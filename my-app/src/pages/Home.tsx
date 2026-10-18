import ConfirmDialog from "../components/ConfirmDialog";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon, PageHeading, Panel } from "../components/UI"
import {
  getSubstitutionList,
  saveSubstitutionList,
} from "../services/substitutions";

export default function Home() {
  const [userData, setUserData] = useState<{ displayName?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [substitutions, setSubstitutions] = useState<string[]>([]);
  const [substitutionsLoading, setSubstitutionsLoading] = useState(false);
  const [savingSubstitutions, setSavingSubstitutions] = useState(false);
  const [substitutionError, setSubstitutionError] = useState("");
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);
  const [newItem, setNewItem] = useState("");

  const updateSubstitutions = async (items: string[]) => {
    if (!currentUserId || savingSubstitutions) return;

    setSavingSubstitutions(true);
    setSubstitutionError("");

    try {
      await saveSubstitutionList(currentUserId, items);
      setSubstitutions(items);
    } catch (error) {
      console.error("Error saving substitution list:", error);
      setSubstitutionError("Could not save your substitution list. Please try again.");
    } finally {
      setSavingSubstitutions(false);
    }
  };

  const addItem = (item: string) => {
    const trimmedItem = item.trim();
    if (trimmedItem && !substitutions.includes(trimmedItem)) {
      void updateSubstitutions([...substitutions, trimmedItem]);
    }
  };

  const removeItem = (indexToRemove: number) => {
    void updateSubstitutions(
      substitutions.filter((_, index) => index !== indexToRemove)
    );
  };

  const clearAll = () => setConfirmClear(true);

  useEffect(() => {
    let active = true;
    let authRequest = 0;

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      const thisRequest = ++authRequest;
      if (!currentUser) {
        setUserData(null);
        setCurrentUserId(null);
        setSubstitutions([]);
        setSubstitutionsLoading(false);
        setSubstitutionError("");
        setLoading(false);
        return;
      }

      setCurrentUserId(currentUser.uid);
      setSubstitutions([]);
      setSubstitutionsLoading(true);
      setSubstitutionError("");
      setLoading(true);

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!active || thisRequest !== authRequest) return;

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({ displayName: data.displayName });
          console.log("✅ Welcome! User data loaded from Firestore:", data);
        } else {
          setUserData(null);
          console.warn("⚠️ User not found in Firestore collection");
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      }

      try {
        let savedSubstitutions = await getSubstitutionList(currentUser.uid);

        if (savedSubstitutions === null) {
          const legacyValue = localStorage.getItem("substitutionList");

          if (legacyValue === null) {
            savedSubstitutions = [];
          } else {
            const parsedValue: unknown = JSON.parse(legacyValue);
            if (
              !Array.isArray(parsedValue) ||
              !parsedValue.every((item) => typeof item === "string")
            ) {
              throw new Error("Saved browser substitution list is invalid.");
            }

            savedSubstitutions = parsedValue;
          }

          await saveSubstitutionList(currentUser.uid, savedSubstitutions);
          localStorage.removeItem("substitutionList");
        }

        if (active && thisRequest === authRequest) {
          setSubstitutions(savedSubstitutions);
        }
      } catch (err) {
        console.error("Error loading substitution list:", err);
        if (active && thisRequest === authRequest) {
          setSubstitutionError("Could not load your substitution list.");
        }
      } finally {
        if (active && thisRequest === authRequest) {
          setSubstitutionsLoading(false);
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      ++authRequest;
      unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      // Sign out from Firebase Auth
      await signOut(auth);
      console.log("✅ Logged out successfully");

      // Clear user data state
      setUserData(null);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <main>
      <ConfirmDialog open={confirmClear} onClose={() => setConfirmClear(false)} onConfirm={() => { setConfirmClear(false); void updateSubstitutions([]); }} />
      <PageHeading eyebrow="Your everyday kitchen" title={userData?.displayName ? `Welcome home, ${userData.displayName.split(' ')[0]}.` : 'Good food starts here.'}>A little inspiration for whatever’s on your table today.</PageHeading>
      <div className="grid gap-4 md:grid-cols-3">
        <section className="relative overflow-hidden rounded-card bg-sage p-7 md:col-span-2 md:p-10">
          <div className="relative z-10 max-w-sm"><p className="eyebrow">A seat at your table</p><h2 className="my-5 font-display text-4xl font-normal leading-tight md:text-5xl">Less wondering.<br />More cooking.</h2><p className="mb-7 text-muted">Find a new favorite, make it your own, stop procrastinating and get cooking.</p><Link to="/recipes" className="btn">Explore recipes <Icon name="arrow" /></Link></div>
          <div aria-hidden="true" className="absolute -right-12 -bottom-16 size-64 rounded-full border-[22px] border-surface/60 bg-sage shadow-card"><div className="m-7 grid size-40 place-items-center rounded-full border border-brand/20 text-brand/50"><Icon name="cook" className="size-20" /></div></div>
        </section>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
          <Link to="/brainstorm" className="panel group bg-clay"><Icon name="spark" className="mb-5 size-7" /><h2>What sounds good?</h2><p className="mt-2 text-sm text-muted">A craving, an ingredient, a little idea. Let’s turn it into dinner.</p><span className="mt-5 flex items-center gap-2 text-sm font-semibold">Find inspiration <Icon name="arrow" /></span></Link>
          <Link to="/cook" className="panel bg-blue-soft"><Icon name="cook" className="mb-5 size-7" /><h2>Let’s get cooking</h2><p className="mt-2 text-sm text-muted">Your favorite dishes, one simple step at a time.</p><span className="mt-5 flex items-center gap-2 text-sm font-semibold">Open cooking mode <Icon name="arrow" /></span></Link>
        </div>

        <Panel className="md:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow mb-2">Make it your own</p>
              <h2>Ingredients to avoid</h2>
            </div>
            <span className="rounded-full bg-sage px-3 py-1 text-sm">
              {substitutions.length} items
            </span>
          </div>

          <p className="mb-5 text-sm text-muted">
            Add ingredients you don't want in your recipes.
            Brainstorm will avoid these ingredients and suggest
            suitable alternatives when generating recipes.
          </p>

          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={e => {
              e.preventDefault();
              addItem(newItem);
              setNewItem('');
            }}
          >
            <label className="sr-only" htmlFor="swap-item">
              Ingredient to avoid
            </label>

            <input
              id="swap-item"
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              placeholder="e.g. chicken, milk, peanuts…"
              maxLength={50}
              disabled={loading || substitutionsLoading || savingSubstitutions}
            />

            <button
              className="btn shrink-0"
              disabled={
                !newItem.trim() ||
                loading ||
                substitutionsLoading ||
                savingSubstitutions
              }
            >
              Add ingredient
            </button>
          </form>

          {(loading || substitutionsLoading || savingSubstitutions) && (
            <p role="status" className="mt-3 text-sm text-muted">
              {savingSubstitutions
                ? 'Saving ingredients to avoid…'
                : 'Loading your ingredients…'}
            </p>
          )}

          {substitutionError && (
            <p role="alert" className="mt-3">
              {substitutionError}
            </p>
          )}

          <ul className="mt-4 flex flex-wrap gap-2">
            {substitutions.map((item, index) => (
              <li
                key={item}
                className="flex items-center gap-2 rounded-xl border border-line bg-linen pl-4 text-sm"
              >
                {item}
                <button
                  className="size-11 rounded-xl hover:bg-clay"
                  onClick={() => removeItem(index)}
                  disabled={savingSubstitutions || substitutionsLoading}
                  aria-label={`Remove ${item}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          {!substitutions.length && !loading && (
            <p className="mt-4 text-sm text-muted">
              No excluded ingredients yet. Add ingredients you want
              Brainstorm to leave out of your recipes.
            </p>
          )}

          {substitutions.length > 0 && (
            <button
              className="mt-3 min-h-11 text-sm text-muted underline"
              onClick={clearAll}
              disabled={savingSubstitutions || substitutionsLoading}
            >
              Clear all excluded ingredients
            </button>
          )}
        </Panel>

        <Panel><Icon name="heart" className="mb-5 size-7 text-brand" /><h2>The keepers</h2><p className="mt-3 mb-6 text-sm text-muted">Good recipes deserve a place to come back to. Keep all your favorites together.</p><Link className="btn-secondary" to="/favorites">Your saved recipes <Icon name="arrow" /></Link></Panel>
      </div>
      <div className="mt-7 flex justify-end"><button className="btn" onClick={handleLogout}>Sign out</button></div>
    </main>
  );
}
