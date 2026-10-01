import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarGenerator } from './avatar-generator';

describe('AvatarGenerator', () => {
  let component: AvatarGenerator;
  let fixture: ComponentFixture<AvatarGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarGenerator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvatarGenerator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
