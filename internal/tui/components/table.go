package components

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

var (
	tableHeaderStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#58a6ff")).
		Bold(true).
		Padding(0, 1).
		BorderBottom(true).
		BorderStyle(lipgloss.NormalBorder()).
		BorderForeground(lipgloss.Color("#30363d"))

	tableRowStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#c9d1d9")).
		Padding(0, 1)

	tableSelectedRowStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#ffffff")).
		Background(lipgloss.Color("#58a6ff")).
		Bold(true).
		Padding(0, 1)
)

// Column defines a table column
type Column struct {
	Title string
	Width int
}

// Row represents a table row as a slice of cell strings
type Row []string

// Table is a simple navigable table component
type Table struct {
	Columns []Column
	Rows    []Row
	Cursor  int
	Offset  int
	Height  int // visible rows
}

// NewTable creates a table with the given columns and visible height
func NewTable(columns []Column, height int) Table {
	return Table{
		Columns: columns,
		Height:  height,
	}
}

// SetRows replaces table data and resets cursor
func (t *Table) SetRows(rows []Row) {
	t.Rows = rows
	t.Cursor = 0
	t.Offset = 0
}

// MoveUp moves the cursor up
func (t *Table) MoveUp() {
	if t.Cursor > 0 {
		t.Cursor--
		if t.Cursor < t.Offset {
			t.Offset = t.Cursor
		}
	}
}

// MoveDown moves the cursor down
func (t *Table) MoveDown() {
	if t.Cursor < len(t.Rows)-1 {
		t.Cursor++
		if t.Cursor >= t.Offset+t.Height {
			t.Offset = t.Cursor - t.Height + 1
		}
	}
}

// SelectedRow returns the currently selected row, or nil
func (t *Table) SelectedRow() Row {
	if t.Cursor >= 0 && t.Cursor < len(t.Rows) {
		return t.Rows[t.Cursor]
	}
	return nil
}

// View renders the table
func (t Table) View() string {
	var b strings.Builder

	// Header
	var headerCells []string
	for _, col := range t.Columns {
		cell := tableHeaderStyle.Width(col.Width).Render(col.Title)
		headerCells = append(headerCells, cell)
	}
	b.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, headerCells...))
	b.WriteString("\n")

	// Rows
	if len(t.Rows) == 0 {
		empty := lipgloss.NewStyle().
			Foreground(lipgloss.Color("#8b949e")).
			Italic(true).
			Padding(1, 2).
			Render("No items to display")
		b.WriteString(empty)
		return b.String()
	}

	end := t.Offset + t.Height
	if end > len(t.Rows) {
		end = len(t.Rows)
	}

	for i := t.Offset; i < end; i++ {
		row := t.Rows[i]
		style := tableRowStyle
		if i == t.Cursor {
			style = tableSelectedRowStyle
		}

		var cells []string
		for j, col := range t.Columns {
			val := ""
			if j < len(row) {
				val = row[j]
			}
			cell := style.Copy().Width(col.Width).Render(truncate(val, col.Width-2))
			cells = append(cells, cell)
		}
		b.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, cells...))
		b.WriteString("\n")
	}

	// Scroll indicator
	if len(t.Rows) > t.Height {
		indicator := lipgloss.NewStyle().
			Foreground(lipgloss.Color("#8b949e")).
			Render(fmt.Sprintf("  showing %d-%d of %d", t.Offset+1, end, len(t.Rows)))
		b.WriteString(indicator)
	}

	return b.String()
}

// truncate truncates a string to fit within maxLen
func truncate(s string, maxLen int) string {
	if maxLen <= 0 {
		return ""
	}
	if len(s) <= maxLen {
		return s
	}
	if maxLen <= 3 {
		return s[:maxLen]
	}
	return s[:maxLen-3] + "..."
}
