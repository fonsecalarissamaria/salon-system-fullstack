import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AgendamentoService } from '../../services/agendamento';

@Component({
  selector: 'app-agendamento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './agendamento.component.html',
  styleUrls: ['./agendamento.component.css'],
})
export class AgendamentoComponent implements OnInit {
  agendamentoForm!: FormGroup;
  dataMinima!: string;

  constructor(
    private fb: FormBuilder,
    private agendamentoService: AgendamentoService,
  ) {}

  ngOnInit(): void {
    // calcula o momento atual antes de montar o formulário
    this.configurarDataMinima();

    this.agendamentoForm = this.fb.group({
      cpf: ['', [Validators.required]],
      data: ['', [Validators.required]],
      servicos: ['', [Validators.required]],
    });
  }

  // metodo que monta a string no formato exato que o HTML exige: YYYY-MM-DDTHH:mm
  configurarDataMinima(): void {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');

    this.dataMinima = `${ano}-${mes}-${dia}T${horas}:${minutos}`;
  }

  confirmarAgendamento(): void {
    if (this.agendamentoForm.invalid) {
      alert('Por favor, preencha todos os campos para agendar.');
      return;
    }

    const dados = { ...this.agendamentoForm.value };
    dados.cpf = dados.cpf.replace(/\D/g, '');

    this.agendamentoService.cadastrar(dados).subscribe({
      next: (mensagemSucesso) => {
        alert(mensagemSucesso);
        this.agendamentoForm.reset();
        // recalcula a data mínima após resetar para atualizar os minutos passados
        this.configurarDataMinima();
      },
      error: (err) => {
        console.error('Erro ao realizar agendamento:', err);
        alert('Ocorreu um erro ao processar seu agendamento. Tente novamente.');
      },
    });
  }
}
