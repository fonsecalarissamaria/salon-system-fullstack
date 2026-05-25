import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelGestaoComponent } from './painel-gestao.component';

describe('PainelGestaoComponent', () => {
  let component: PainelGestaoComponent;
  let fixture: ComponentFixture<PainelGestaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelGestaoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PainelGestaoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
