import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.css'],
})
export class CadastroComponent implements OnInit {
  cadastroForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  private inicializarFormulario(): void {
    this.cadastroForm = this.fb.group({
      id: [''],
      nome: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      cpf: ['', [Validators.required]],
      telefone: ['', [Validators.required]],
      endereco: this.fb.group({
        cep: ['', [Validators.required]],
        logradouro: ['', [Validators.required]],
        numero: ['', [Validators.required]],
        complemento: [''],
        bairro: ['', [Validators.required]],
        cidade: ['', [Validators.required]],
        uf: ['', [Validators.required, Validators.maxLength(2)]],
      }),
    });
  }

  salvarCliente(): void {
    if (this.cadastroForm.invalid) {
      alert('Por favor, preencha todos os campos obrigatórios corretamente.');
      return;
    }

    // Clona os dados e limpa as máscaras/pontuações
    const dadosFormulario = { ...this.cadastroForm.value };
    dadosFormulario.cpf = dadosFormulario.cpf.replace(/\D/g, '');
    dadosFormulario.telefone = dadosFormulario.telefone.replace(/\D/g, '');
    dadosFormulario.endereco.cep = dadosFormulario.endereco.cep.replace(/\D/g, '');

    const id = dadosFormulario.id;

    if (id) {
      this.clienteService.atualizar(dadosFormulario).subscribe({
        next: () => {
          alert('Cadastro atualizado com sucesso!');
          this.cadastroForm.reset();
        },
        error: (err) => console.error('Erro ao atualizar:', err),
      });
    } else {
      // Remove o ID vazio para enviar um POST limpo
      delete dadosFormulario.id;
      this.clienteService.cadastrar(dadosFormulario).subscribe({
        next: () => {
          alert('Cadastro realizado com sucesso!');
          this.cadastroForm.reset();
        },
        error: (err) => {
          alert('Erro ao salvar. Verifique os dados informados.');
          console.error(err);
        },
      });
    }
  }
}
