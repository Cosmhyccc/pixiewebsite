// Tailor the copy to how Stripe sent the customer back (?result=success|cancel|portal).
// Unknown or missing results keep the generic text already in the page.
(function () {
  var copy = {
    success: ['You’re all set.', 'Payment received. Head back to Pixie and it’ll unlock in a moment.', 'If Pixie doesn’t open, launch it from Applications.'],
    cancel: ['No worries.', 'Checkout was cancelled and you haven’t been charged. You can pick a plan again anytime from Pixie.', 'If Pixie doesn’t open, launch it from Applications.'],
    portal: ['Back to your buddy.', 'Any changes you made to your subscription are saved. Head back to Pixie to keep going.', 'If Pixie doesn’t open, launch it from Applications.']
  }[new URLSearchParams(location.search).get('result')];
  if (!copy) return;
  document.getElementById('title').textContent = copy[0];
  document.getElementById('message').textContent = copy[1];
  document.getElementById('hint').textContent = copy[2];
  document.title = copy[0] + ' — Pixie';
})();
