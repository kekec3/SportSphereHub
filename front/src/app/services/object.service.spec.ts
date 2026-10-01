import { TestBed } from '@angular/core/testing';

import { ObjectService } from './object.service';

describe('Object', () => {
  let service: Object;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
