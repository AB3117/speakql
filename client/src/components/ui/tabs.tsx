import * as React from "react";
import { createContext, useContext } from "react";

// Create context for tabs
type TabsContextValue = {
  selectedTab: string;
  setSelectedTab: (id: string) => void;
};

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

// Utility function to use tabs context
function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

// Main Tabs container component
interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) {
  const [selectedTab, setSelectedTab] = React.useState(value || defaultValue || "");

  const handleTabChange = React.useCallback(
    (value: string) => {
      setSelectedTab(value);
      onValueChange?.(value);
    },
    [onValueChange]
  );

  // Update controlled value
  React.useEffect(() => {
    if (value !== undefined && value !== selectedTab) {
      setSelectedTab(value);
    }
  }, [value]);

  return (
    <TabsContext.Provider value={{ selectedTab, setSelectedTab: handleTabChange }}>
      <div className={`w-full ${className || ""}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// TabsList component for containing tab triggers
interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div className={`flex border-b mb-4 ${className || ""}`} role="tablist" {...props}>
      {children}
    </div>
  );
}

// TabsTrigger component for individual tab buttons
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export function TabsTrigger({ value, children, className, ...props }: TabsTriggerProps) {
  const { selectedTab, setSelectedTab } = useTabsContext();
  const isSelected = selectedTab === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      className={`py-2 px-4 text-sm font-medium focus:outline-none border-b-2 ${
        isSelected
          ? "border-blue-500 text-blue-600"
          : "border-transparent text-gray-600 hover:text-blue-500"
      } ${className || ""}`}
      onClick={() => setSelectedTab(value)}
      {...props}
    >
      {children}
    </button>
  );
}

// TabsContent component for the content of each tab
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export function TabsContent({ value, children, className, ...props }: TabsContentProps) {
  const { selectedTab } = useTabsContext();
  const isSelected = selectedTab === value;

  if (!isSelected) return null;

  return (
    <div 
      role="tabpanel" 
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
