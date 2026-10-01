import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortableTable } from './sortable-table';

describe('SortableTable', () => {
  let component: SortableTable;
  let fixture: ComponentFixture<SortableTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortableTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SortableTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
