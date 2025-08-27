import React, { useEffect, useState } from "react";
import Select from "react-select";

export type Option = {
  value: string;
  label: string;
};

export interface SelectProps {
  options: Option[];
  defaultValue?: Option;
  value?: Option | undefined;
  className?: string;
  styles?: any;
  onChange?: (selectedOption: Option | null) => void;
  instanceId?: string;
}

const CommonSelect: React.FC<SelectProps> = ({ options, defaultValue, value, className, onChange, instanceId }) => {
  const [selectedOption, setSelectedOption] = useState<Option | undefined>(value ?? defaultValue);

  const handleChange = (option: Option | null) => {
    setSelectedOption(option || undefined);
    if (onChange) {
      onChange(option);
    }
  };
  useEffect(() => {
    setSelectedOption(value ?? (defaultValue ?? undefined));
  }, [value, defaultValue])
  
  return (
    <Select
     classNamePrefix="react-select"
      className={className}
      // styles={customStyles}
      options={options}
      value={selectedOption}
      onChange={handleChange}
      placeholder="Select"
      instanceId={instanceId}
    />
  );
};

export default CommonSelect;
