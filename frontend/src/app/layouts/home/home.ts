import { Component } from '@angular/core';
import {Header } from '../../components/header/header';
import { Chatbot } from '../../components/chatbot/chatbot';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [Header, Chatbot, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
