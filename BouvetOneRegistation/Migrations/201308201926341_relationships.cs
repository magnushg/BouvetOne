namespace BouvetOneRegistation.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class relationships : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Sessions", "Level", c => c.String(maxLength: 4000));
            DropColumn("dbo.Sessions", "Name");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Sessions", "Name", c => c.String(maxLength: 4000));
            DropColumn("dbo.Sessions", "Level");
        }
    }
}
