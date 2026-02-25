type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <label className="block w-full sm:w-64">
      <span className="sr-only">Search tracks</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Recherche rapide..."
        className="w-full rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-cyan-400 focus:outline-none"
        aria-label="Search tracks"
      />
    </label>
  );
};
