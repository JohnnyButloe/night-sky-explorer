// app/components/ui/DatePicker.tsx
'use client';

import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
}

export default function DatePicker({
  selected,
  onChange,
  className,
}: DatePickerProps) {
  return (
    <div className="relative">
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="yyyy-MM-dd"
        className={
          className ||
          'w-full bg-gray-800 text-white border border-gray-600 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 shadow-sm hover:shadow-md'
        }
        calendarClassName="bg-gray-900 text-white border border-gray-700 rounded-md shadow-lg"
      />
    </div>
  );
}
