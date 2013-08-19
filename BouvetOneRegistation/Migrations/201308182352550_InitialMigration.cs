namespace BouvetOneRegistation.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class InitialMigration : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.Speakers",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(maxLength: 4000),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Sessions",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(maxLength: 4000),
                        Title = c.String(maxLength: 4000),
                        Description = c.String(maxLength: 4000),
                        Speaker_Id = c.Int(),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Speakers", t => t.Speaker_Id)
                .Index(t => t.Speaker_Id);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.Sessions", "Speaker_Id", "dbo.Speakers");
            DropIndex("dbo.Sessions", new[] { "Speaker_Id" });
            DropTable("dbo.Sessions");
            DropTable("dbo.Speakers");
        }
    }
}
