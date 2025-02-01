import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FilterType } from "@/lib/types";

type FilterProps = {
  activeFilter: string;
  filter: FilterType;
  onFilterChange: (value: string) => void;
};

const Filter = ({ filter, onFilterChange, activeFilter }: FilterProps) => {
  const handleChange = (event: any) => {
    onFilterChange(filter.id);
  };
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex flex-col items-center w-fit gap-2"
        onClick={handleChange}
      >
        {filter.icon ? (
          <span className="text-2xl">{filter.icon}</span>
        ) : filter.image ? (
          <img src={filter.image} alt={filter.label} className="w-6 h-6 m-1" />
        ) : null}
        <Label className="text-xs text-center">{filter.label}</Label>
      </div>

      {activeFilter === filter.id && (
        <Separator className="h-0.5 mt-4 w-4/6 bg-black" />
      )}
    </div>
  );
};

type FilterBarProps = {
  activeFilter: string;
  filters: FilterType[];
  onFilterChange: (value: string) => void;
};

const FilterBar = ({
  filters,
  onFilterChange,
  activeFilter,
}: FilterBarProps) => {
  return (
    <div className="flex justify-center gap-8 w-5/6 max-w-full overflow-x-auto pl-16">
      {filters.map((filter) => (
        <Filter
          key={filter.id}
          filter={filter}
          onFilterChange={onFilterChange}
          activeFilter={activeFilter}
        />
      ))}
    </div>
  );
};

export default FilterBar;
