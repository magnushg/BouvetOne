namespace BouvetOneRegistation.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class session_time : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Sessions", "StartTime", c => c.DateTime());
            AddColumn("dbo.Sessions", "EndTime", c => c.DateTime());
        }
        
        public override void Down()
        {
            DropColumn("dbo.Sessions", "EndTime");
            DropColumn("dbo.Sessions", "StartTime");
        }
    }
}
