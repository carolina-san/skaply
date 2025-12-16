import { Directive, OnInit, HostListener } from '@angular/core';

@Directive()
export abstract class Legal implements OnInit {
  showScrollButton = false;

  ngOnInit() {
    this.updateScrollButtonVisibility();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.updateScrollButtonVisibility();
  }

  protected updateScrollButtonVisibility() {
    this.showScrollButton = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

