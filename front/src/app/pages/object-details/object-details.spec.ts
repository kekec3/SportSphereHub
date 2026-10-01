import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectDetails } from './object-details';

describe('ObjectDetails', () => {
  let component: ObjectDetails;
  let fixture: ComponentFixture<ObjectDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjectDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObjectDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
