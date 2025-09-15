const Customers = () => {
  const customers = [
    { name: "Vietnam Investments Group", logo: "VIG" },
    { name: "Mega Market", logo: "MM" },
    { name: "VNG Corporation", logo: "VNG" },
    { name: "T&A Ogilvy", logo: "T&A" },
    { name: "My Duc Hospital", logo: "MDH" },
    { name: "Roland Berger", logo: "RB" },
    { name: "Edelman Vietnam", logo: "EV" },
    { name: "FPT Software", logo: "FPT" }
  ];

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            <span className="text-primary">Khách hàng</span> tin tùy
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Được tin tưởng bởi hàng nghìn doanh nghiệp và tổ chức hàng đầu Việt Nam
          </p>
        </div>

        {/* Customer Logos Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center justify-items-center">
          {customers.map((customer, index) => (
            <div
              key={index}
              className="group flex items-center justify-center w-full h-16 bg-card hover:bg-card/80 rounded-lg border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-md"
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <span className="text-xs font-bold text-primary">{customer.logo}</span>
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  {customer.name.split(' ')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t border-border/40">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary mb-2">50,000+</p>
            <p className="text-sm text-muted-foreground">Khảo sát đã tạo</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary mb-2">2M+</p>
            <p className="text-sm text-muted-foreground">Phản hồi thu thập</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary mb-2">1,200+</p>
            <p className="text-sm text-muted-foreground">Doanh nghiệp tin tưởng</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary mb-2">99.9%</p>
            <p className="text-sm text-muted-foreground">Thời gian hoạt động</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Customers;