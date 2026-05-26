import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminLoginComponent } from './admin-login.component';

describe('AdminLoginComponent', () => {
  let component: AdminLoginComponent;
  let fixture: ComponentFixture<AdminLoginComponent>;

  const mockRouter = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [AdminLoginComponent],
      providers: [{ provide: Router, useValue: mockRouter }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLoginComponent);
    component = fixture.componentInstance;

    sessionStorage.clear();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve fazer login com sucesso quando a senha estiver correta', () => {
    component.senhaAdmin = 'leila123';

    component.validarSenha();

    expect(component.exibirErro).toBe(false); // Ajustado para Vitest
    expect(sessionStorage.getItem('leilaLogada')).toBe('sim');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/painel-gestao']);
  });

  it('deve exibir erro e limpar o campo de senha quando a senha estiver incorreta', () => {
    component.senhaAdmin = 'senha_errada';

    component.validarSenha();

    expect(component.exibirErro).toBe(true); // Ajustado para Vitest
    expect(component.senhaAdmin).toBe('');
    expect(sessionStorage.getItem('leilaLogada')).toBeNull();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
