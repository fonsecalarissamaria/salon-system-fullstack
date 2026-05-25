import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css'],
})
export class AdminLoginComponent {
  senhaAdmin = '';
  exibirErro = false;

  constructor(private router: Router) {}

  validarSenha(): void {
    if (this.senhaAdmin === 'leila123') {
      this.exibirErro = false;
      sessionStorage.setItem('leilaLogada', 'sim');

      // redireciona para a rota do painel de gestão
      this.router.navigate(['/painel-gestao']);
    } else {
      this.exibirErro = true;
      this.senhaAdmin = ''; // Limpa o campo de senha
    }
  }
}
