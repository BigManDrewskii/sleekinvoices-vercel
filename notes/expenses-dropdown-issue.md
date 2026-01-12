# Expenses Page Dropdown Issue

The user's screenshot shows a small chevron/dropdown icon (^) on the left side of each expense row.
This is the expand/collapse button that toggles to show expense details.

Looking at the code in Expenses.tsx lines 892-902, this is a Button with ChevronUp/ChevronDown icons
that toggles the `expandedExpenses` state to show/hide expense details.

The issue is that this button appears to be non-functional or its purpose is unclear to users.
The button should expand the row to show additional details like vendor, payment method, tax, etc.

Solution: Convert the expenses list to a proper Table component for consistency with other pages,
which will also make the expand functionality more intuitive or remove it in favor of a details dialog.
