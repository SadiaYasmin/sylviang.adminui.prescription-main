import { Component, Input } from '@angular/core';
import { IExecutiveSummaryResponse } from '@core/interfaces/analytics/analytics.interface';

@Component({
  selector: 'app-executive-summary-tab',
  standalone: false,
  templateUrl: './executive-summary-tab.component.html',
  styleUrl: './executive-summary-tab.component.scss',
})
export class ExecutiveSummaryTabComponent {
  @Input() summary: IExecutiveSummaryResponse | null = null;
  @Input() loading = false;
}
