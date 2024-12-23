document.querySelector('.close-btn').addEventListener('click', function() {
    this.classList.toggle('collapsed');
    document.querySelector('.sidebar').classList.toggle('collapsed');
    // إرسال رسالة للصفحة الأم عند تغيير حالة القائمة
    window.parent.postMessage('toggleSidebar', '*');
});
