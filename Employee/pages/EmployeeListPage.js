const BasePage = require('./BasePage');

// Verified live: this grid is a real Kendo Grid (<kendo-grid>) with a
// genuine <table> inside — unlike the Contact module's card-based list or
// its ngx-datatable tab grids. Reached only via the "View" link on the
// Employee form (the sidebar's "Employees" item goes straight to the
// Add/Edit form instead).
class EmployeeListPage extends BasePage {
  constructor(page) {
    super(page);
    // Verified live: a second, hidden <kendo-grid> exists elsewhere on the
    // page (an EMI calculator widget) — scope to :visible.
    this.grid = page.locator('kendo-grid:visible');
    // Verified live: the sidebar's own global search box shares the exact
    // same "search-k-cst" class (id="box") as the grid's real search
    // input — scope to the attribute unique to the Kendo textbox.
    this.searchInput = page.locator('input[kendotextbox]');
    this.newLink = page.locator('a[href="#/Contact/ContactToEmployees"]', { hasText: 'New' });
    this.pdfExportIcon = page.locator('kendo-grid-toolbar a, kendo-grid-toolbar button').first();
    this.rows = this.grid.locator('table tbody tr');
    this.pagerFirst = page.locator('a.k-pager-first');
    this.pagerPrev = page.locator('a[title="Go to the previous page"]');
    this.pagerNext = page.locator('a[title="Go to the next page"]');
    this.pagerLast = page.locator('a[title="Go to the last page"]');
    this.pagerInfo = page.locator('.k-pager-info');
    // Verified live: a no-results search still renders one <tr> — a Kendo
    // "no records" placeholder row — so row count alone can't detect an
    // empty grid.
    this.noRecordsRow = this.grid.locator('.k-grid-norecords');
    // Verified live: real Kendo toolbar export links.
    this.pdfExportLink = page.locator('a.k-grid-pdf');
    this.excelExportLink = page.locator('a.k-grid-excel').first();
    this.employeeNameHeader = this.grid.locator('th', { hasText: 'Employee Name' });
    this.basicAmountHeader = this.grid.locator('th', { hasText: 'Basic Amount' });
    this.columnMenuIcon = (header) => header.locator('.k-header-column-menu, [class*="column-menu"]').first();
  }

  editIconInRow(rowText) {
    return this.rows.filter({ hasText: rowText }).locator('a:has(div[title="Edit"])');
  }

  async search(term) {
    await this.fill(this.searchInput, term);
    await this.page.waitForTimeout(500);
  }

  async clickNew() {
    await this.click(this.newLink);
  }

  async getRowCount() {
    return this.rows.count();
  }
}

module.exports = EmployeeListPage;
