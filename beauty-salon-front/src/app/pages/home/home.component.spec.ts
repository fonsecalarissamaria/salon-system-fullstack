import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest'; // Importações do Vitest
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        // Fornece um mock vazio para o ActivatedRoute para evitar erros com o RouterLink
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Substitui o whenStable() para sincronizar a renderização inicial
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
